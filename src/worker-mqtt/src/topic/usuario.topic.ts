import usuarioService from "../services/usuario.service";

export const usuarioRoutesMQTT = (route:string,mac:string,payload:any)=>{

    switch (route){
        case 'login_request':
            usuarioService.loginRequest(mac,payload.uid)
            break;
        
    }

}
