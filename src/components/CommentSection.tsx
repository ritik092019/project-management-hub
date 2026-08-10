import React, { useState, useEffect } from 'react';
import { Comment, User } from '../types.js';
import { fetchProjectComments, postProjectComment, deleteComment } from '../services/api.js';
import { RoleBadge } from './RoleBadge.js';
import { MessageSquare, Send, CornerDownRight, Trash2, AtSign, Sparkles } from 'lucide-react';

interface CommentSectionProps {
  projectId: string;
  currentUser: User | null;
  usersList?: User[];
}

export const CommentSection: React.FC<CommentSectionProps> = ({ projectId, currentUser, usersList = [] }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [showMentionMenu, setShowMentionMenu] = useState(false);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await fetchProjectComments(projectId);
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [projectId]);

  const handleTextChange = (text: string, isReply = false) => {
    if (isReply) {
      setReplyText(text);
    } else {
      setNewCommentText(text);
    }

    // Check for @mention trigger
    const lastWord = text.split(/\s+/).pop() || '';
    if (lastWord.startsWith('@')) {
      setMentionQuery(lastWord.substring(1).toLowerCase());
      setShowMentionMenu(true);
    } else {
      setShowMentionMenu(false);
    }
  };

  const insertMention = (userName: string, isReply = false) => {
    if (isReply) {
      const words = replyText.split(/\s+/);
      words.pop();
      setReplyText([...words, `@${userName} `].join(' '));
    } else {
      const words = newCommentText.split(/\s+/);
      words.pop();
      setNewCommentText([...words, `@${userName} `].join(' '));
    }
    setShowMentionMenu(false);
  };

  const handlePostComment = async (parentId?: string | null) => {
    const text = parentId ? replyText : newCommentText;
    if (!text.trim() || !currentUser) return;

    try {
      setSubmitting(true);
      await postProjectComment(projectId, text, parentId);
      if (parentId) {
        setReplyText('');
        setReplyingToId(null);
      } else {
        setNewCommentText('');
      }
      await loadComments();
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await deleteComment(commentId);
      await loadComments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete comment');
    }
  };

  const renderFormattedContent = (content: string) => {
    // Highlight @mentions in blue/amber pills
    const parts = content.split(/(@[A-Za-z0-9._\s]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={i}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30"
          >
            <AtSign className="w-3 h-3 text-blue-400" />
            {part.substring(1)}
          </span>
        );
      }
      return part;
    });
  };

  const filteredUsers = usersList.filter(u =>
    mentionQuery ? u.name.toLowerCase().includes(mentionQuery) : true
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Discussion & Team Comments ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
          </h3>
        </div>
        <span className="text-xs text-slate-400">
          Tip: Type <code className="px-1 py-0.5 rounded bg-slate-800 text-blue-300 font-mono text-[11px]">@Name</code> to mention teammates
        </span>
      </div>

      {/* New Comment Input Box */}
      {currentUser ? (
        <div className="relative bg-slate-900/80 rounded-2xl border border-slate-800 p-3.5 space-y-3">
          <div className="flex items-center gap-2">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-500/40"
            />
            <span className="text-xs font-semibold text-slate-200">{currentUser.name}</span>
            <RoleBadge role={currentUser.role} size="sm" />
          </div>

          <div className="relative">
            <textarea
              value={newCommentText}
              onChange={e => handleTextChange(e.target.value)}
              placeholder="Ask a question, request clarification, or mention team members with @..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none transition-all"
            />

            {/* Mention Suggestions Menu */}
            {showMentionMenu && filteredUsers.length > 0 && (
              <div className="absolute left-3 bottom-12 z-20 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden max-h-40 overflow-y-auto">
                <div className="p-1.5 text-[10px] uppercase font-bold text-slate-400 bg-slate-950 border-b border-slate-800">
                  Mention Teammate
                </div>
                {filteredUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => insertMention(u.name)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-blue-600 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full object-cover" />
                    <div>
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-[10px] text-slate-400 group-hover:text-blue-100">{u.title || u.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Real-time notifications sent upon posting</span>
            </div>
            <button
              onClick={() => handlePostComment(null)}
              disabled={submitting || !newCommentText.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Posting...' : 'Post Comment'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-400">
          Please log in to participate in project discussions.
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading comments thread...</div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/30 rounded-2xl border border-slate-800/60 space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto opacity-50" />
            <p className="text-xs font-semibold text-slate-400">No discussions yet</p>
            <p className="text-[11px] text-slate-500">Be the first to leave feedback or ask a technical question.</p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 space-y-3">
              {/* Comment Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={comment.authorAvatar}
                    alt={comment.authorName}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-800"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{comment.authorName}</span>
                      <RoleBadge role={comment.authorRole} size="sm" />
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(comment.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                {(currentUser?.role === 'ADMIN' || currentUser?.email === comment.authorEmail) && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Delete Comment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Comment Content */}
              <p className="text-xs text-slate-300 leading-relaxed pl-1 whitespace-pre-wrap">
                {renderFormattedContent(comment.content)}
              </p>

              {/* Reply Button */}
              {currentUser && (
                <div className="pt-1">
                  <button
                    onClick={() => {
                      setReplyingToId(replyingToId === comment.id ? null : comment.id);
                      setReplyText(`@${comment.authorName} `);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 cursor-pointer transition-colors"
                  >
                    <CornerDownRight className="w-3.5 h-3.5" />
                    <span>Reply to thread</span>
                  </button>
                </div>
              )}

              {/* Threaded Reply Box */}
              {replyingToId === comment.id && currentUser && (
                <div className="mt-3 ml-4 pl-3 border-l-2 border-blue-500/50 space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <textarea
                    value={replyText}
                    onChange={e => handleTextChange(e.target.value, true)}
                    placeholder="Write a reply..."
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setReplyingToId(null)}
                      className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handlePostComment(comment.id)}
                      disabled={submitting || !replyText.trim()}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 cursor-pointer"
                    >
                      Send Reply
                    </button>
                  </div>
                </div>
              )}

              {/* Nested Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 ml-4 pl-3 border-l-2 border-slate-800 space-y-3">
                  {comment.replies.map(reply => (
                    <div key={reply.id} className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={reply.authorAvatar}
                            alt={reply.authorName}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-xs font-bold text-slate-200">{reply.authorName}</span>
                          <RoleBadge role={reply.authorRole} size="sm" />
                        </div>
                        {(currentUser?.role === 'ADMIN' || currentUser?.email === reply.authorEmail) && (
                          <button
                            onClick={() => handleDeleteComment(reply.id)}
                            className="text-slate-500 hover:text-rose-400 cursor-pointer p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {renderFormattedContent(reply.content)}
                      </p>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(reply.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
