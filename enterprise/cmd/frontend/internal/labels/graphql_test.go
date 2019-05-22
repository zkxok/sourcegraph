package labels

import "github.com/sourcegraph/sourcegraph/cmd/frontend/graphqlbackend"

func init() {
	graphqlbackend.Labels = GraphQLResolver{}
}
