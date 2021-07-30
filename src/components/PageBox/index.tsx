import React from 'react';
import Box from '@material-ui/core/Box';

const PageBox = ({ children }: { children?: React.ReactNode }) => (
  <Box
    height="100%"
    display="flex"
    flexDirection="column"
    style={{
      // width: '96%',
      // maxWidth: '96%',
      paddingLeft: 20,
      paddingRight: 20,
      // paddingBottom: '100px', // for footer
      minHeight: '88vh',
      position: 'relative',
    }}
  >
    {children}
  </Box>
);

export default PageBox;
