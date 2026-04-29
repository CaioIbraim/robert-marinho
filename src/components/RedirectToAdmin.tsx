import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const RedirectToAdmin = ({ to = '/admin/dashboard' }) => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace: true });
  }, [to, navigate]);

  return null;
};