# API / Service contract

This phase does not expose HTTP REST endpoints — the client talks to
Firebase directly through the SDK, wrapped in the typed service functions
below, secured by Security Rules. Later phases (Admin dashboard, etc.) may
add Route Handlers under `app/api/**`; when they do, document them here.

## Auth (`lib/auth/authService.ts`)
| function | signature | notes |
|---|---|---|
| `registerWithEmail` | `(email: string, password: string) => Promise<User>` | Creates Firebase Auth user only; profile doc created by `onUserCreate` trigger |
| `loginWithEmail` | `(email: string, password: string) => Promise<User>` | |
| `logout` | `() => Promise<void>` | |
| `requestPasswordReset` | `(email: string) => Promise<void>` | Sends Firebase's reset email |
| `changePassword` | `(currentPassword: string, newPassword: string) => Promise<void>` | Re-authenticates first |
| `describeAuthError` | `(error: unknown) => string` | Friendly error mapping, never leaks internals |

## Users (`lib/users/*`)
| function | signature | notes |
|---|---|---|
| `findUserByUserId` | `(userId: string) => Promise<PublicUserProfile \| null>` | Client-safe; strips private fields in code (defense in depth alongside Rules) |
| `createUserProfile` | `(params) => Promise<UserDocument>` | **Server-only.** Alternative to the `onUserCreate` trigger — use one or the other |

## Conversations (`lib/conversations/*`)
| function | signature | notes |
|---|---|---|
| `createOrGetDirectConversation` | `(currentUid: string, otherUid: string) => Promise<string>` | Returns `conversationId`; idempotent via `directKey` |

## Messages (`lib/messages/*`)
| function | signature | notes |
|---|---|---|
| `sendMessage` | `(params: {conversationId, senderId, type, text?, replyTo?, metadata?}) => Promise<string>` | Returns `messageId`; updates conversation + both inbox previews atomically |
| `editMessage` | `(params: {conversationId, messageId, newText}) => Promise<void>` | Sender-only, enforced by Rules |
| `deleteMessage` | `(params: {conversationId, messageId, deletedBy}) => Promise<void>` | Soft delete only |
| `markMessageAsRead` | `(params: {conversationId, messageId, uid}) => Promise<void>` | Adds `uid` to `readBy` |
| `markConversationAsRead` | `(params: {conversationId, uid}) => Promise<void>` | Zeroes the caller's `unreadCount` |
| `getMessagesPage` | `(conversationId, cursor?, pageSize?) => Promise<MessagesPage>` | Cursor-based pagination, default 30/page |

## Realtime presence/typing (`lib/realtime/presence.ts`)
| function | signature | notes |
|---|---|---|
| `startPresence` | `(uid: string) => () => void` | Call once per session; returns an unsubscribe function |
| `setTyping` | `(conversationId, uid, isTyping) => Promise<void>` | Debounce `true` calls on the caller's side |
| `subscribeToTyping` | `(conversationId, onChange) => () => void` | Returns an unsubscribe function |

## Types (`types/*.ts`)
`UserDocument`, `PublicUserProfile`, `ConversationDocument`,
`ConversationMemberDocument`, `UserConversationPreview`, `MessageDocument`,
`MessageType`, `MessageStatus`, `MessageMetadata` — these are the contract
future phases (UI, Admin) should import rather than re-declaring shapes.

## Cloud Functions (`functions/src/*`)
| function | trigger | notes |
|---|---|---|
| `onUserCreate` | Auth `onCreate` | Allocates unique `userId`, writes `users/{uid}` |
