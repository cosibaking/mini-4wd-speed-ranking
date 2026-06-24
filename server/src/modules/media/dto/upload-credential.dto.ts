export type MediaPurpose =
  | 'track_floor_plan'
  | 'track_example_video'
  | 'record_video'
  | 'record_config'
  | 'record_car_photo'
  | 'post_image'
  | 'comment_image';

export type MediaFileExt = 'jpg' | 'jpeg' | 'png' | 'mp4';

export interface UploadCredentialRequest {
  mediaType: 'image' | 'video';
  purpose: MediaPurpose;
  fileExt: MediaFileExt;
  fileSize: number;
}

export interface UploadCredential {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
  expireAt: string;
  headers: Record<string, string>;
}

export interface MediaMeta {
  objectKey: string;
  publicUrl: string;
  mediaType: 'image' | 'video';
  purpose: MediaPurpose;
  fileSize: number;
  status: 'pending' | 'confirmed';
}
