export interface JwtPayload {
  sub: string;
  role: string;
  email: string;
  iat?: number;
  exp?: number;
}
