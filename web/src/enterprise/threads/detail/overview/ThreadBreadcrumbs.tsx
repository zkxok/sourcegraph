import { upperFirst } from 'lodash'
import React from 'react'
import { Link } from 'react-router-dom'
import * as GQL from '../../../../../../shared/src/graphql/schema'
import { threadNoun } from '../../util'

interface Props {
    thread: GQL.IDiscussionThread
    className?: string
}

/**
 * The breadcrumbs for a thread.
 */
export const ThreadBreadcrumbs: React.FunctionComponent<Props> = ({ thread, className = '' }) => (
    <nav className={`d-flex align-items-center ${className}`} aria-label="breadcrumb">
        <ol className="breadcrumb">
            <li className="breadcrumb-item">
                <Link to={thread.type === GQL.ThreadType.CHECK ? '/checks' : '/threads'}>
                    {upperFirst(threadNoun(thread.type, true))}
                </Link>
            </li>
            <li className="breadcrumb-item active font-weight-bold">
                <Link to={thread.url}>#{thread.idWithoutKind}</Link>
            </li>
        </ol>
    </nav>
)
