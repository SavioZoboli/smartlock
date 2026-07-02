import usuarioService from "./usuario.service";

const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");

class AuthService {
  // A chave de cliente fornecida pelo painel do Google Cloud
  private GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  // O segredo para assinar o NOSSO token de sessão
  private JWT_SECRET = process.env.JWT_SECRET;
  private JWT_EXPIRATION = process.env.JWT_EXPIRATION;

  private googleClient = new OAuth2Client(this.GOOGLE_CLIENT_ID);

  async processGoogleLogin(googleToken: string) {
    try {
      // 1. Validação: Verifica a assinatura do token no Google
      const ticket = await this.googleClient.verifyIdToken({
        idToken: googleToken,
        audience: this.GOOGLE_CLIENT_ID,
      });

      // 2. Extração dos dados úteis do Payload do Google
      const payload = ticket.getPayload();
      const { sub: googleId, email, name: nome, picture: avatar } = payload;

      const userData = { nome, email, avatar };

      // 3. Integração com o Banco de Dados (Você precisa implementar essa função)
      // Buscamos pelo email ou pelo ID único do Google (sub)
      let user = await usuarioService.getUserByEmail(email);

      if (!user) {
        let sessionToken = this.geraTokenTemporario(email,nome,avatar);

        return {
          sessionToken,
          userData,
          cadastrado: false,
        };
      } else {

        user = await usuarioService.updateAvatar(user.id,avatar);

        let sessionToken = this.geraToken(user.id, user.email,user.nome+" "+user.sobrenome,user.avatar);

        return {
          sessionToken,
          userData,
          cadastrado:true
        };
      }
    } catch (error) {
      console.error("Erro ao validar token do Google:", error);
      throw new Error("Token inválido ou expirado. Acesso Negado.");
    }
  }

  private geraTokenTemporario(email: string,nome:string,avatar:string): string {
    return jwt.sign({ email: email ,nome:nome,avatar:avatar}, this.JWT_SECRET, { expiresIn: "15min" });
  }

  public geraToken(id: number, email: string,nome:string,avatar:string): string {
    return jwt.sign(
      { id, email,nome,avatar}, // Payload da nossa aplicação
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRATION },
    );
  }
}

export default new AuthService();
