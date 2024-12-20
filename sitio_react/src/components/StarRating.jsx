import React from 'react';

const StarRating = ({ rating }) => {
  const maxStars = 5;
  return (
    <div style={{ display: 'inline-block', color: '#FFD700' }}>
      {Array.from({ length: maxStars }, (_, index) => (
        <i
          key={index}
          className={`bi ${
            index < rating ? 'bi-star-fill' : 'bi-star'
          }`}
          style={{ marginRight: '4px' }}
        ></i>
      ))}
    </div>
  );
};

export default StarRating;
