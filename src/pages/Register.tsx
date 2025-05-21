
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/auth?tab=register', { replace: true });
  }, [navigate]);

  return null;
};

export default Register;
