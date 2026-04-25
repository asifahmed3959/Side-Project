import { useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { createQuote } from '../store/quotesSlice';

const QuoteForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    await dispatch(createQuote({ quote: text }));
    setText('');
    setLoading(false);
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share a quote..."
        style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #45475a', background: '#313244', color: '#cdd6f4', fontSize: 15, outline: 'none' }}
      />
      <button
        type="submit"
        disabled={loading || !text.trim()}
        style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: loading || !text.trim() ? '#45475a' : '#89b4fa', color: '#1e1e2e', fontWeight: 700, cursor: loading || !text.trim() ? 'default' : 'pointer', fontSize: 15 }}
      >
        {loading ? '…' : 'Add'}
      </button>
    </form>
  );
};

export default QuoteForm;
