import { NextPage } from 'next';
import Head from 'next/head';
import { trpc } from '../utils/trpc';
import {
	Avatar,
	Button,
	Box,
	Stack,
	Heading,
	Text,
	useDisclosure,
	Input,
	Image,
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalFooter,
	ModalBody,
	ModalCloseButton,
	useToast, 
} from '@chakra-ui/react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import Croppie from 'croppie';
import {useDropzone} from 'react-dropzone'

var imgBuffer = null;
var imgBufferType = null;
var cropper = null;

const HomePage: NextPage = ({}) => {
	const toast = useToast();
	const {
		isOpen: isOpenUploadModal,
		onOpen: onOpenUploadModal,
		onClose: onCloseUploadModal
	} = useDisclosure(); 
	const {
		isOpen: isOpenEditProfileModal,
		onOpen: onOpenEditProfileModal,
		onClose: onCloseEditProfileModal
	} = useDisclosure();

	const isCropping = false;


	const {getRootProps, getInputProps, isDragActive} = useDropzone({
		accept: 'image/*',
		onDrop: acceptedFiles => {
			// console.log(acceptedFiles);
			const file = acceptedFiles[0];
			if (file.type.slice(0, 5) != 'image') {
				toast({
					title: 'Please upload image files only',
					status: 'error',
					isClosable: true,
					position: 'bottom-right',
				});
				reuploadImgHandler();
			} else {
				document.getElementById('drop_box').hidden = true;
				document.getElementById('reupload_button').hidden = false;
				isCropping = true;
				const image = document.getElementById('imgtest');
				cropper = new Croppie(image, {
					viewport: {
						width: 200,
						height: 200,
						type:'circle'
					},
					boundary:{
						width: 300,
						height: 300
					}
				});
				const reader = new FileReader();
				reader.onabort = () => {
					toast({
						title: 'Image read aborted',
						status: 'error',
						isClosable: true,
						position: 'bottom-right',
					});
				};
				reader.onerror = () => {
					toast({
						title: 'Image read error',
						status: 'error',
						isClosable: true,
						position: 'bottom-right',
					});
				};
				reader.onload = () => {
					cropper.bind({
						url: reader.result
					});
					imgBuffer = reader.result;
					imgBufferType = file.type;
				}
				reader.readAsDataURL(file);
			}
		}
	});

	const uploadImgHandler = () => {
		onOpenUploadModal();
		document.getElementById('crop_confirm_button').hidden = false;
		document.getElementById('preview_confirm_button').hidden = true;
	}

	const previewHandler = () => {
		if(cropper != null) {
			cropper.result('base64').then((croppedImg) => {
			imgBuffer = croppedImg;
			}).then(() => {
				document.getElementById('imgtest').hidden = true;
				document.getElementById('reupload_button').hidden = true;
				document.getElementById('crop_confirm_button').hidden = true;
				document.getElementById('preview_confirm_button').hidden = false;
				document.getElementById('recrop_button').hidden = false;
				document.getElementById('preview_img').hidden = false;
				document.getElementById('preview_img').src = imgBuffer;
				document.getElementById('upload_header').innerHTML  = 'Confirm Image'
			});
		} else {
			toast({
				title: 'Please upload an image',
				status: 'error',
				isClosable: true,
				position: 'bottom-right',
			})
		}
	}

	const reuploadImgHandler = () => {
		cropper.destroy();
		document.getElementById('drop_box').hidden = false;
	}

	const recropImpHandler = () => {
		document.getElementById('imgtest').hidden = false;
		document.getElementById('reupload_button').hidden = false;
		document.getElementById('recrop_button').hidden = true;
		document.getElementById('crop_confirm_button').hidden = false; 
		document.getElementById('preview_confirm_button').hidden = true;
		document.getElementById('preview_img').hidden = true;
		document.getElementById('upload_header').innerHTML  = 'Upload Image'
	}

	const sendImg = trpc.useMutation('my-image.upload-image');

	const sendImgHandler = () => {
		console.log(typeof imgBuffer);
		sendImg.mutate({image: imgBuffer, type: imgBufferType}, {
			onSuccess: () => {
				toast({
					title: 'Image uploaded',
					status: 'success',
					isClosable: true,
					position: 'bottom-right',
				});
				onCloseUploadModal();
			},
			onError: (error) => {
				toast({
					title: error.message,
					status: 'error',
					isClosable: true,
					position: 'bottom-right',
				});
			}
		});
		console.log(sendImg.text);
	}

	var username = 'User1';
	var wallet_key = 'JIOPmopiMJNp890POK<M)IPUJassdfsdfsdfdfASDFasdgthrRJTWersfgh'

	const profileEditorHandler = () => {

		onOpenEditProfileModal();
	}

	// const uploadImgHandler = () => {
	// 	onOpenUploadModal();
	// }

	return (
		<>	
			<link  href='https://cdnjs.cloudflare.com/ajax/libs/croppie/2.6.5/croppie.css' rel='stylesheet'></link>
			<script src='https://cdnjs.cloudflare.com/ajax/libs/croppie/2.6.5/croppie.js'></script>
			<Head>
				<title>Home Page</title>
			</Head>
				<Stack>
					<Button onClick={() => profileEditorHandler()}>
						Edit Profile
					</Button>
					<Stack direction='row' justify='center' p="5">
						<Avatar size='2xl' src='https://firebasestorage.googleapis.com/v0/b/image-storage-demo-4244f.appspot.com/o/d2dd9f73-cbc9-44d2-b690-7b46349bc706?alt=media&token=ca509b96-43cd-44fc-9b02-24c4cb00b05a' />
					</Stack>
					<Button onClick={() => onOpenUploadModal()}>
						Change Profile Picture
					</Button>
					<Text fontSize='md'>Username</Text>
					<Input id='username_input' placeholder={username}/>
					<Text fontSize='md' >Public Key</Text>
					<Input id='public_key_input' placeholder={wallet_key}/>

					<Modal id="upload_modal" isOpen={isOpenUploadModal} onClose={onCloseUploadModal}>
						<ModalContent>
							<ModalHeader id='upload_header'>Upload Image</ModalHeader>
							<ModalCloseButton />
							<div id='imgtest'></div>
							<Image id='preview_img' hidden={true} src='gibbresh.png' fallbackSrc='https://via.placeholder.com/150' />
							<ModalBody>
								<Box
									borderColor="gray.300"
									borderStyle="dashed"
									borderWidth="2px"
									_hover={{
										shadow: "md"
									}}
									id="drop_box"
									{...getRootProps()}
		          				>
									<Stack p="8" textAlign="center" spacing="-2">
										<Heading fontSize="lg" color="gray.700" fontWeight="bold">
											Drop image here
										</Heading>
										<Text fontWeight="light">or click to upload</Text>
									</Stack>
									<Input
										type="file"
										height="100%"
										width="100%"
										position="absolute"
										top="0"
										left="0"
										opacity="0"
										aria-hidden="true"
										accept="image/*"
										{...getInputProps()}
									/>
								</Box>
							</ModalBody>

							<ModalFooter>
								<Button id='reupload_button' mr={3} hidden={true} onClick={() => reuploadImgHandler()}>
									Reupload
								</Button>
								<Button id='recrop_button' mr={3} hidden={true} onClick={() => recropImpHandler()}>
									Recrop
								</Button>
								<Button id='crop_confirm_button' colorScheme='blue' mr={3} onClick={() => previewHandler()}>
									Ok
								</Button>
								<Button id='preview_confirm_button' hidden={true} colorScheme='blue' mr={3} onClick={() => sendImgHandler()}>
									Upload
								</Button>
								
							</ModalFooter>
						</ModalContent>
					</Modal>
					<Button id='save_profile_button' colorScheme='red' mr={3} onClick={() => sendImgHandler()}>
									Save
								</Button>
				</Stack>
		</>
	);
};

export default HomePage;
