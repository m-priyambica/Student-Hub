// src/pages/Wishlist.jsx - simple fetch of wishlist items
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Wishlist() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    axios.get('/api/wishlist/').then(res => setItems(res.data)).catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2>My Wishlist</h2>
      {items.length === 0 ? <p>No items in wishlist.</p> : items.map(i => <div key={i.id}>{i.title}</div>)}
    </div>
  );
}