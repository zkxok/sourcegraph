package labels

import (
	"context"

	"github.com/graph-gophers/graphql-go"
	"github.com/graph-gophers/graphql-go/relay"
	"github.com/sourcegraph/sourcegraph/cmd/frontend/backend"
	"github.com/sourcegraph/sourcegraph/cmd/frontend/graphqlbackend"
)

func init() {
	graphqlbackend.LabelByID = func(ctx context.Context, id graphql.ID) (graphqlbackend.Label, error) {
		return labelByID(ctx, id)
	}
}

// gqlLabel implements the GraphQL type Label.
type gqlLabel struct{ db *dbLabel }

// labelByID looks up and returns the Label with the given GraphQL ID. If no such Label exists, it
// returns a non-nil error.
func labelByID(ctx context.Context, id graphql.ID) (*gqlLabel, error) {
	dbID, err := unmarshalLabelID(id)
	if err != nil {
		return nil, err
	}
	return labelByDBID(ctx, dbID)
}

// labelByDBID looks up and returns the Label with the given database ID. If no such Label exists,
// it returns a non-nil error.
func labelByDBID(ctx context.Context, dbID int64) (*gqlLabel, error) {
	v, err := dbLabels{}.GetByID(ctx, dbID)
	if err != nil {
		return nil, err
	}
	// 🚨 SECURITY: Only the organization's members and site admins may view or modify a label.
	if err := backend.CheckOrgAccess(ctx, v.OwnerOrgID); err != nil {
		return nil, err
	}
	return &gqlLabel{db: v}, nil
}

func (v *gqlLabel) ID() graphql.ID {
	return marshalLabelID(v.db.ID)
}

func marshalLabelID(id int64) graphql.ID {
	return relay.MarshalID("Label", id)
}

func unmarshalLabelID(id graphql.ID) (dbID int64, err error) {
	err = relay.UnmarshalSpec(id, &dbID)
	return
}

func (v *gqlLabel) Name() string { return v.db.Name }

func (v *gqlLabel) Description() *string { return v.db.Description }

func (v *gqlLabel) Color() string { return v.db.Color }

func (v *gqlLabel) Owner(ctx context.Context) (*graphqlbackend.NodeResolver, error) {
	org, err := graphqlbackend.OrgByIDInt32(ctx, v.db.OwnerOrgID)
	if err != nil {
		return nil, err
	}
	return &graphqlbackend.NodeResolver{Node: org}, nil
}
