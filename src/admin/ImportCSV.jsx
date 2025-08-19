'use client';

import React, { useState } from 'react';
import styles from './ImportCSV.module.css';
import { FaUpload } from 'react-icons/fa';
import Papa from 'papaparse';
import { toast } from 'react-toastify';

const ImportCSV = ({projectSlug}) => {
  const [uploaded, setUploaded] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data);
        setUploaded(true);
        toast.success('CSV file imported successfully!');
      },
    });
  };

 const handlePublish = async () => {
  if (!csvData.length) return;


  const codes = csvData
    .map((row) => {
      if (!row.code) return null; // Skip invalid rows


      return {
        code: row.code.trim(),
        discordId: row.discordId?.trim() || null,
        discordUsername: row.discordUsername?.trim() || null,
      };
    })
    .filter(Boolean);


  if (!codes.length) {
    toast.error('CSV must contain at least one valid code');
    return;
  }


  setLoading(true);
  try {
    const token = import.meta.env.VITE_APP_UPLOAD_TOKEN;
    if (!token) throw new Error('Missing upload token');


    const res = await fetch('http://localhost:3001/api/admin/upload-codes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ projectSlug, codes }),  // ✅ yes, this is correct
    });


    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Failed to upload to server');
    }


    const response = await res.json();
    toast.success(`Uploaded ${codes.length} codes`);
  } catch (err) {
    console.error(err);
    toast.error('Error uploading CSV: ' + err.message);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className={styles.container}>
      <label htmlFor="csv-upload" className={`${styles.uploadBtn} ${uploaded ? styles.uploaded : ''}`}>
        <FaUpload className={styles.icon} />
        {uploaded ? 'Uploaded ✅' : 'Import your CSV'}
      </label>
      <input
        id="csv-upload"
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className={styles.hiddenInput}
      />
      {uploaded && (
        <button className={styles.publishBtn} onClick={handlePublish} disabled={loading}>
          {loading ? 'Publishing...' : 'Publish'}
        </button>
      )}
    </div>
  );
};


export default ImportCSV;








