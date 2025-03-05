// wdyr.js
import React from 'react';
import whyDidYouRender from '@welldone-software/why-did-you-render';

if (process.env.NODE_ENV === 'development') {
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    trackHooks: true,
    logOwnerReasons: true,
    logOnDifferentValues: true,
    collapseGroups: true,
    titleColor: 'green',
    diffNameColor: 'darkturquoise',
  });
  
  // Add debug logs
  console.log('WDYR initialized in development mode');
}