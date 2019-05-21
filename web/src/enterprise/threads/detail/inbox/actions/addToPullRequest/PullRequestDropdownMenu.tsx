import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DropdownItem, DropdownMenu, DropdownMenuProps } from 'reactstrap'
import * as GQL from '../../../../../../../../shared/src/graphql/schema'
import { asError, ErrorLike, isErrorLike } from '../../../../../../../../shared/src/util/errors'
import { PullRequest, STATUS_ITEMS } from '../../../actions/ThreadStatusItemsList'

interface Props extends Pick<DropdownMenuProps, 'right'> {
    /** Called when the user clicks on an existing pull request to add to. */
    onAddToExistingThreadClick: (pull: PullRequest) => void
}

const LOADING: 'loading' = 'loading'

const queryStatusItems = async () => STATUS_ITEMS

/**
 * A dropdown menu with a list of pull requests and an option to create a new pull request.
 */
export const PullRequestDropdownMenu: React.FunctionComponent<Props> = ({
    onAddToExistingThreadClick: onAddToExistingPullRequestClick,
    ...props
}) => {
    const [pullRequestsOrError, setPullRequestsOrError] = useState<typeof LOADING | PullRequest[] | ErrorLike>(LOADING)

    // tslint:disable-next-line: no-floating-promises
    useMemo(async () => {
        try {
            setPullRequestsOrError(await queryStatusItems())
        } catch (err) {
            setPullRequestsOrError(asError(err))
        }
    }, [])

    const MAX_ITEMS = 9 // TODO!(sqs): hack

    return (
        <DropdownMenu {...props}>
            <Link to="TODO!(sqs)" className="dropdown-item">
                New pull request
            </Link>
            <DropdownItem divider={true} />
            {pullRequestsOrError === LOADING ? (
                <DropdownItem header={true} className="py-1">
                    Loading pull requests...
                </DropdownItem>
            ) : isErrorLike(pullRequestsOrError) ? (
                <DropdownItem header={true} className="py-1">
                    Error loading existing pull requests
                </DropdownItem>
            ) : (
                <>
                    <DropdownItem header={true} className="py-1">
                        Add to existing pull request...
                    </DropdownItem>
                    {pullRequestsOrError.slice(0, 1).map((pull, i) => (
                        <DropdownItem
                            key={i}
                            // tslint:disable-next-line: jsx-no-lambda
                            onClick={() => onAddToExistingPullRequestClick(pull)}
                            className="d-flex justify-content-between align-items-center"
                        >
                            {pull.repo} <small className="text-muted ml-3">#{pull.prNumber}</small>
                        </DropdownItem>
                    ))}
                </>
            )}
        </DropdownMenu>
    )
}
