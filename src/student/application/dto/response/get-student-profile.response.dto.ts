import { GetStudentProfileResponseDTO } from "./get-student-profile.response.dto.type";


class GetStudentProfileResponseDTOImpl implements
	GetStudentProfileResponseDTO {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
}

export {
	GetStudentProfileResponseDTOImpl
};