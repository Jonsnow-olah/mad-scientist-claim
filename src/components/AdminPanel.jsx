import React, { useEffect, useState } from 'react';
import styles from './AdminPanel.module.css';


export default function AdminPanel({ projectSlug }) {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claimed, setClaimed] = useState(0);
  const [unclaimed, setUnclaimed] = useState(0);
  const [total, setTotal] = useState(0);


  async function fetchCodes() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3001/api/admin/get-codes?projectSlug=${projectSlug}`);
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (!res.ok) throw new Error(data.error || 'Failed to fetch codes');
        setCodes(data.codes);
        setClaimed(data.claimed);
        setUnclaimed(data.unclaimed);
        setTotal(data.total);
      } catch (parseError) {
        throw new Error('Invalid server response. Please check the backend.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    fetchCodes();
  }, [projectSlug]);


  return (
    <div className={styles.panelContainer}>
      <h2>Codes for <strong>{projectSlug}</strong></h2>
      <button onClick={fetchCodes} className={styles.refreshButton}>
        Refresh Codes
      </button>


      {loading && <p>Loading codes...</p>}
      {error && <p className={styles.error}>Error: {error}</p>}


      {!loading && !error && (
        <>
          <p>Total: {total} | Claimed: {claimed} | Unclaimed: {unclaimed}</p>


          <table className={styles.codesTable}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Discord ID</th>
                <th>Username</th>
                <th>Redeemed</th>
                <th>Updated At</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => (
                <tr key={code.id}>
                  <td>{code.code}</td>
                  <td>{code.discord_id || '-'}</td>
                  <td>{code.username || '-'}</td>
                  <td>{code.redeemed ? '✅' : '❌'}</td>
                  <td>{code.updated_at || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
