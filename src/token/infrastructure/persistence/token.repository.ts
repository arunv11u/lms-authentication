import nconf from "nconf";
import {
	ErrorCodes,
	GenericError,
	JSONWebToken,
	JSONWebTokenImpl,
	JWTPayload,
	PostgresqlRepository
} from "../../../utils";
import { getStudentFactory } from "../../../global-config";
import { StudentEntity, StudentFactory, StudentRepository } from "../../../student";
import { TokenObject, TokenRepository } from "../../domain";
import { TokenCreationAttributes, TokenORMEntity, TokenTypes, UserTypes } from "./token.orm-entity";


export class TokenRepositoryImpl implements TokenRepository, TokenObject {
	private _modelName = "Token";
	private _jsonWebToken: JSONWebToken;
	private _postgresqlRepository: PostgresqlRepository | null = null;
	private _studentFactory: StudentFactory;

	constructor() {
		this._jsonWebToken = new JSONWebTokenImpl();
		this._studentFactory = getStudentFactory();
	}

	set postgresqlRepository(postgresqlRepository: PostgresqlRepository) {
		this._postgresqlRepository = postgresqlRepository;
	}

	async createAccessTokenForStudent(
		sessionId: string,
		student: StudentEntity
	): Promise<string> {
		if (!this._postgresqlRepository)
			throw new GenericError({
				code: ErrorCodes.postgresqlRepositoryDoesNotExist,
				error: new Error("Postgresql repository does not exist"),
				errorCode: 500
			});

		const secretKey = nconf.get("JWT_PRIVATE_KEY");
		const accessTokenExpiration = nconf.get("accessTokenExpiration");

		const jwtPayload = new JWTPayload();
		jwtPayload.user = student.id;
		jwtPayload.type = UserTypes.student;
		jwtPayload.sessionId = sessionId;

		const token = await this._jsonWebToken
			.sign(
				JSON.parse(JSON.stringify(jwtPayload)),
				secretKey,
				{ expiresIn: accessTokenExpiration }
			);

		return token;
	}

	async createRefreshTokenForStudent(
		sessionId: string,
		student: StudentEntity
	): Promise<string> {
		if (!this._postgresqlRepository)
			throw new GenericError({
				code: ErrorCodes.postgresqlRepositoryDoesNotExist,
				error: new Error("Postgresql repository does not exist"),
				errorCode: 500
			});

		const studentRepository = this._studentFactory.make("StudentRepository") as StudentRepository;
		studentRepository.postgresqlRepository = this._postgresqlRepository;

		const userId = await studentRepository
			.getUserIdWithStudentId(student.id);

		const refreshTokenExpiration = nconf.get("refreshTokenExpiration");
		const refreshToken = this._postgresqlRepository.getId();

		const tokenORMEntity = new TokenORMEntity();
		tokenORMEntity.created_by = userId;
		tokenORMEntity.id = refreshToken;
		tokenORMEntity.last_modified_by = userId;
		tokenORMEntity.session_id = sessionId;
		tokenORMEntity.type = TokenTypes.refresh;
		tokenORMEntity.token_expire_on = new Date(
			new Date()
				.setSeconds(new Date().getSeconds() + refreshTokenExpiration)
		);
		tokenORMEntity.user_id = userId;
		tokenORMEntity.user_type = UserTypes.student;
		tokenORMEntity.version = 1;

		await this._postgresqlRepository
			.add<TokenORMEntity, TokenCreationAttributes>(
				this._modelName,
				tokenORMEntity
			);

		return refreshToken;
	}
}