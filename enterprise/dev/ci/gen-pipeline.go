// gen-pipeline.go generates a Buildkite YAML file that tests the entire
// Sourcegraph application and writes it to stdout.
package main

import (
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"

	bk "github.com/sourcegraph/sourcegraph/pkg/buildkite"
)

func init() {
	bk.Plugins["gopath-checkout#v1.0.1"] = map[string]string{
		"import": "github.com/sourcegraph/sourcegraph",
	}
}

func main() {
	pipeline := &bk.Pipeline{}

	defer func() {
		_, err := pipeline.WriteTo(os.Stdout)
		if err != nil {
			panic(err)
		}
	}()

	branch := os.Getenv("BUILDKITE_BRANCH")
	version := os.Getenv("BUILDKITE_TAG")
	commit := os.Getenv("BUILDKITE_COMMIT")
	if commit == "" {
		commit = "1234567890123456789012345678901234567890" // for testing
	}
	now := time.Now()
	if strings.HasPrefix(branch, "docker-images-debug/") {
		// A branch like "docker-images-debug/foobar" will produce Docker images
		// tagged as "debug-foobar-$COMMIT".
		version = fmt.Sprintf("debug-%s-%s", strings.TrimPrefix(branch, "docker-images-debug/"), commit)
	} else if strings.HasPrefix(version, "v") {
		// The Git tag "v1.2.3" should map to the Docker image "1.2.3" (without v prefix).
		version = strings.TrimPrefix(version, "v")
	} else {
		buildNum, _ := strconv.Atoi(os.Getenv("BUILDKITE_BUILD_NUMBER"))
		version = fmt.Sprintf("%05d_%s_%.7s", buildNum, now.Format("2006-01-02"), commit)
	}

	bk.OnEveryStepOpts = append(bk.OnEveryStepOpts,
		bk.Env("GO111MODULE", "on"),
		bk.Env("PUPPETEER_SKIP_CHROMIUM_DOWNLOAD", "true"),
		bk.Env("FORCE_COLOR", "1"),
		bk.Env("ENTERPRISE", "1"),
		bk.Env("COMMIT_SHA", commit),
		bk.Env("DATE", now.Format(time.RFC3339)),
	)

	if os.Getenv("MUST_INCLUDE_COMMIT") != "" {
		output, err := exec.Command("git", "merge-base", "--is-ancestor", os.Getenv("MUST_INCLUDE_COMMIT"), "HEAD").CombinedOutput()
		if err != nil {
			fmt.Printf("This branch %s at commit %s does not include commit %s.\n", branch, commit, os.Getenv("MUST_INCLUDE_COMMIT"))
			fmt.Println("Rebase onto the latest master to get the latest CI fixes.")
			fmt.Println(string(output))
			panic(err)
		}
	}

	pipeline.AddStep(":chromium:",
		// Avoid crashing the sourcegraph/server containers. See
		// https://github.com/sourcegraph/sourcegraph/issues/2657
		bk.ConcurrencyGroup("e2e"),
		bk.Concurrency(1),

		bk.Env("IMAGE", "sourcegraph/server:insiders"),
		bk.Env("VERSION", version),
		bk.Env("PUPPETEER_SKIP_CHROMIUM_DOWNLOAD", ""),
		bk.Cmd("./dev/ci/e2e.sh"),
		bk.ArtifactPaths("./puppeteer/*.png;./web/e2e.mp4;./web/ffmpeg.log"))
}
