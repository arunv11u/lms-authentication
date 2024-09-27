import { SignInInstructorWithGmailResponseDTO } from "./sign-in-instructor-with-gmail.response.dto.type";


class SignInInstructorWithGmailResponseDTOImpl implements
	SignInInstructorWithGmailResponseDTO {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	accessToken: string;
	refreshToken: string;
	profilePicture: string | null = null;
}

export {
	SignInInstructorWithGmailResponseDTOImpl
};