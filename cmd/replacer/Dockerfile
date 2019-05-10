FROM sourcegraph/alpine:3.9

RUN apk --no-cache add pcre-dev

# TODO(RVT) fixup hardcoded version and path, or use seperate container binary
COPY --from=comby/comby:0.4.0 /usr/local/bin/comby /usr/local/bin/comby

EXPOSE 3185
USER sourcegraph
ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/replacer"]
COPY replacer /usr/local/bin/
