import React from 'react';

import WarningCard from '../WarningCard';

export default function ExcludeLimitOrderWarning() {
  return (
    <div style={{ marginTop: '8px' }}>
      <WarningCard
        warning="Small Order: Takers pay a 0x protocol fee, which is higher than the premium takers receive from your order. Please increase size or change price to create the limit order."
        learnMore="small limit"
      />
    </div>
  );
}
