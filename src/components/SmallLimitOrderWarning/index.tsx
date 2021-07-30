import React from 'react';

import WarningCard from '../WarningCard';

export default function SmallLimitOrderWarning() {
  return (
    <div style={{ marginTop: '8px' }}>
      <WarningCard
        warning="Small Limit Order Warning: small limit orders are less likely to be taken, since takers must pay a 0x protocol
          fee for each order they fill."
        learnMore="small limit"
      />
    </div>
  );
}
