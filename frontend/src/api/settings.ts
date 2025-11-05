import api from './client';

export const getAllowNewUserRegistration = async (): Promise<{
  success: boolean;
  allow: boolean;
}> => {
  const response = await api.get('/api/settings/allow_new_user_registration');
  return response.data;
};

export const getAllSettings = async (): Promise<{
  success: boolean;
  settings: Record<string, string | null>;
}> => {
  const response = await api.get('/api/settings');
  return response.data;
};

export const updateAllowNewUserRegistration = async (
  allow: boolean
): Promise<{ success: boolean; message: string }> => {
  const response = await api.put('/api/settings/allow_new_user_registration', {
    allow,
  });
  return response.data;
};
