import apiClient from './api';

export type UploadFolder = 'avatars' | 'salons' | 'services' | 'reviews';

export const uploadImage = async (
    file: File,
    folder: UploadFolder = 'avatars',
): Promise<{ url: string; publicId: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{ url: string; publicId: string }>(
        `/upload?folder=${folder}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
};

export const uploadMultiple = async (
    files: File[],
    folder: UploadFolder = 'avatars',
): Promise<Array<{ url: string; publicId: string }>> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const response = await apiClient.post<Array<{ url: string; publicId: string }>>(
        `/upload/multiple?folder=${folder}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
};
