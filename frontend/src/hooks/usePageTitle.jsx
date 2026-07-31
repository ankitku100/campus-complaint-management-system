import { useEffect } from 'react';
import { BRAND_NAME } from '../config/brand';

export const usePageTitle = (pageTitle) => {
  useEffect(() => {
    document.title = pageTitle ? `${BRAND_NAME} | ${pageTitle}` : BRAND_NAME;
  }, [pageTitle]);
};

