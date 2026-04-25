import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { updateQuote, deleteQuote } from '../store/quotesSlice';
import type { Quote } from '../types';

interface Props {
  quote: Quote;
}

const QuoteCard: React.FC<Props> = ({ quote }) => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const isOwner = currentUser?.username === quote.created_by;

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(quote.quote);

  const save = () => {
    if (text.trim() && text !== quote.quote) {
      dispatch(updateQuote({ id: quote.id, payload: { quote: text } }));
    }
    setEditing(false);
  };

  const remove = () => {
    if (window.confirm('Delete this quote?')) {
      dispatch(deleteQuote(quote.id));
    }
  };

  return (
    <div style={{ background: '#313244', borderRadius: 10, padding: '16px 20px', marginBottom: 12 }}>
      {editing ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #89b4fa', background: '#1e1e2e', color: '#cdd6f4', resize: 'vertical', fontSize: 15 }}
            rows={3}
            autoFocus
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={save} style={btn('#a6e3a1')}>Save</button>
            <button onClick={() => { setText(quote.quote); setEditing(false); }} style={btn('#f38ba8')}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <blockquote style={{ margin: 0, fontStyle: 'italic', color: '#cdd6f4', fontSize: 16, lineHeight: 1.6 }}>
            "{quote.quote}"
          </blockquote>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span style={{ fontSize: 13, color: '#89b4fa' }}>— @{quote.created_by}</span>
            {isOwner && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditing(true)} style={btn('#89b4fa')}>Edit</button>
                <button onClick={remove} style={btn('#f38ba8')}>Delete</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const btn = (bg: string): React.CSSProperties => ({
  padding: '4px 12px',
  borderRadius: 6,
  border: 'none',
  background: bg,
  color: '#1e1e2e',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: 13,
});

export default QuoteCard;
