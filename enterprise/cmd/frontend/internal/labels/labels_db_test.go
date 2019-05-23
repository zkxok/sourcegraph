package labels

import (
	"reflect"
	"testing"

	"github.com/sourcegraph/sourcegraph/cmd/frontend/db"
	"github.com/sourcegraph/sourcegraph/pkg/db/dbtesting"
)

func TestDB_Labels(t *testing.T) {
	if testing.Short() {
		t.Skip()
	}
	resetMocks()
	ctx := dbtesting.TestContext(t)

	proj1, err := db.Projects.Create(ctx, "o1")
	if err != nil {
		t.Fatal(err)
	}
	proj2, err := db.Projects.Create(ctx, "o2")
	if err != nil {
		t.Fatal(err)
	}

	wantLabel0 := &dbLabel{ProjectID: proj1.ID, Name: "n0", Description: strptr("d0"), Color: "h0"}
	label0, err := dbLabels{}.Create(ctx, wantLabel0)
	if err != nil {
		t.Fatal(err)
	}
	label1, err := dbLabels{}.Create(ctx, &dbLabel{ProjectID: proj1.ID, Name: "n1", Description: strptr("d1"), Color: "h1"})
	if err != nil {
		t.Fatal(err)
	}
	{
		// Check Create result.
		if label0.ID == 0 {
			t.Error("got ID == 0, want non-zero")
		}
		tmp := label0.ID
		label0.ID = 0 // for testing equality of all other fields
		if !reflect.DeepEqual(label0, wantLabel0) {
			t.Errorf("got %+v, want %+v", label0, wantLabel0)
		}
		label0.ID = tmp
	}

	{
		// Get a label.
		label, err := dbLabels{}.GetByID(ctx, label0.ID)
		if err != nil {
			t.Fatal(err)
		}
		if label.ID == 0 {
			t.Error("got ID == 0, want non-zero")
		}
		label.ID = 0 // for testing equality of all other fields
		if !reflect.DeepEqual(label, wantLabel0) {
			t.Errorf("got %+v, want %+v", label, wantLabel0)
		}
	}

	{
		// List all labels.
		ts, err := dbLabels{}.List(ctx, dbLabelsListOptions{})
		if err != nil {
			t.Fatal(err)
		}
		const want = 2
		if len(ts) != want {
			t.Errorf("got %d labels, want %d", len(ts), want)
		}
		count, err := dbLabels{}.Count(ctx, dbLabelsListOptions{})
		if err != nil {
			t.Fatal(err)
		}
		if count != want {
			t.Errorf("got %d, want %d", count, want)
		}
	}

	{
		// List proj1's labels.
		ts, err := dbLabels{}.List(ctx, dbLabelsListOptions{ProjectID: proj1.ID})
		if err != nil {
			t.Fatal(err)
		}
		const want = 2
		if len(ts) != want {
			t.Errorf("got %d labels, want %d", len(ts), want)
		}
	}

	{
		// List proj2's labels.
		ts, err := dbLabels{}.List(ctx, dbLabelsListOptions{ProjectID: proj2.ID})
		if err != nil {
			t.Fatal(err)
		}
		const want = 0
		if len(ts) != want {
			t.Errorf("got %d labels, want %d", len(ts), want)
		}
	}

	{
		// Query labels.
		ts, err := dbLabels{}.List(ctx, dbLabelsListOptions{Query: "n1"})
		if err != nil {
			t.Fatal(err)
		}
		if want := []*dbLabel{label1}; !reflect.DeepEqual(ts, want) {
			t.Errorf("got %+v, want %+v", ts, want)
		}
	}

	{
		// Delete a label.
		if err := (dbLabels{}).DeleteByID(ctx, label0.ID); err != nil {
			t.Fatal(err)
		}
		ts, err := dbLabels{}.List(ctx, dbLabelsListOptions{ProjectID: proj1.ID})
		if err != nil {
			t.Fatal(err)
		}
		const want = 1
		if len(ts) != want {
			t.Errorf("got %d labels, want %d", len(ts), want)
		}
	}
}

func strptr(s string) *string { return &s }
