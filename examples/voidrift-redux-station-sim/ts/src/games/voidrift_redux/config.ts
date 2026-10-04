import { lazy } from 'react';

export const config = {
  id: 'voidrift_redux',
  label: 'VoidRift Redux',
  status: 'dev',
  color: '#7c3aed',
  component: lazy(() => import('./App')),
};
