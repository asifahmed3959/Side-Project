import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { fetchQuotes } from '../store/quotesSlice';
import Navbar from '../components/Navbar';
import QuoteCard from '../components/QuoteCard';
import QuoteForm from '../components/QuoteForm';

const QuotesPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, error, count } = useSelector((s: RootState) => s.quotes);

  const [search, setSearch] = useState('');
  const [mineOnly, setMineOnly] = useState(false);

  useEffect(() => {
    dispatch(fetchQuotes({ search: search || undefined, mine: mineOnly || undefined }));
  }, [dispatch, search, mineOnly]);

  return (
    <div style={{ minHeight: '100vh', background: '#1e1e2e', color: '#cdd6f4' }}>
      <Navbar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>
        <h1 style={{ marginBottom: 24, fontSize: 26, fontWeight: 700 }}>
          Quotes <span style={{ fontSize: 15, opacity: 0.5, fontWeight: 400 }}>({count})</span>
        </h1>

        <QuoteForm />

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
          <input
            placeholder="Search quotes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: '1px solid #45475a', background: '#313244', color: '#cdd6f4', fontSize: 14, outline: 'none' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={mineOnly}
              onChange={(e) => setMineOnly(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            My quotes
          </label>
        </div>

        {loading && <p style={{ textAlign: 'center', opacity: 0.5 }}>Loading…</p>}
        {error && <p style={{ color: '#f38ba8', textAlign: 'center' }}>{error}</p>}
        {!loading && items.length === 0 && (
          <p style={{ textAlign: 'center', opacity: 0.5 }}>No quotes found.</p>
        )}
        {items.map((q) => <QuoteCard key={q.id} quote={q} />)}
      </div>
    </div>
  );
};

export default QuotesPage;
