import Swal from 'sweetalert2';

export const showToast = (title: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
    background: '#1a1a1a',
    color: '#fff',
  });

  return Toast.fire({
    icon,
    title
  });
};

export const showAlert = (title: string, text: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  return Swal.fire({
    title,
    text,
    icon,
    background: '#1a1a1a',
    color: '#fff',
    confirmButtonColor: '#ff2d2d',
    confirmButtonText: 'Entendido'
  });
};

export const showConfirm = (title: string, text: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ff2d2d',
    cancelButtonColor: '#333',
    confirmButtonText: 'Sim, confirmar',
    cancelButtonText: 'Cancelar',
    background: '#1a1a1a',
    color: '#fff',
  });
};
