import { createRouter } from './context';
import { z } from 'zod';
import { env } from "../../env/server.mjs";
import * as trpc from '@trpc/server';
import { fs } from 'fs';

import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';


if (admin.apps.length === 0) {
	admin.initializeApp({
		credential: admin.credential.cert({
			type: env.FIREBASE_TYPE,
			project_id: env.FIREBASE_PROJECT_ID,
			private_key_id: env.FIREBASE_PRIVATE_KEY_ID,
			private_key: env.FIREBASE_PRIVATE_KEY,
			client_email: env.FIREBASE_CLIENT_EMAIL,
			client_id: env.FIREBASE_CLIENT_ID,
			auth_uri: env.FIREBASE_AUTH_URI,
			token_uri: env.FIREBASE_TOKEN_URI,
			auth_provider_x509_cert_url: env.FIREBASE_AUTH_PROVIDER_CERT_URL,
			client_x509_cert_url: env.FIREBASE_CLIENT_CERT_URL
		}),
		storageBucket: env.FIREBASE_STORAGEBUCKET
	});
}

const bucket = admin.storage().bucket();

export const myImageRouter = createRouter()
	.mutation('upload-image', {
		input: z
			.object({
				image: z.string().nullish(),
				type: z.string().nullish(),
			}),
		resolve({ input }) {
			const token = uuidv4();
			const img_uuid = uuidv4();

			const file = bucket.file(img_uuid);

			const base64img = input.image.replace(/^data:image\/(png|jpg);base64,/, "");
			const fileBuffer = Buffer.from(base64img, 'base64');
			file.save(fileBuffer, {
				metadata: {
					contentType: input.type,
					metadata: {
						firebaseStorageDownloadTokens: token,
					},
				}
			}, (err) => {
				if(err) {
					throw new trpc.TRPCError({ code: err});
				}
				else {
					const link = 'https://firebasestorage.googleapis.com/v0/b/image-storage-demo-4244f.appspot.com/o/';
					const imgId = file.id;
					const accessUrl = link + imgId + '?alt=media&token=' + token;
					console.log('File uploaded at ' + accessUrl);
				}
			});
			return {
				text: 'input.image',
			};
		}
	});
