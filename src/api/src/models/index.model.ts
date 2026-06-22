import Unidade from './unidade.model';
import Usuario from './usuario.model';
import SmartLock from './smartlock.model';
import Equipamento from './equipamento.model';
import Movimentacao from './movimentacao.model'; // Mantendo o padrão .models enviado
import LogUsuario from './logUsuario.model';
import LogSmartlock from './logSmartlock.model';

// ============================================================================
// DEFINIÇÃO DOS RELACIONAMENTOS (ASSOCIATIONS)
// ============================================================================

// 1. Relacionamentos de UNIDADE
Unidade.hasMany(Usuario, { foreignKey: 'unidade_lotacao_id', as: 'usuarios' });
Usuario.belongsTo(Unidade, { foreignKey: 'unidade_lotacao_id', as: 'unidadeLotacao' });

Unidade.hasMany(SmartLock, { foreignKey: 'unidade_id', as: 'smartlocks' });
SmartLock.belongsTo(Unidade, { foreignKey: 'unidade_id', as: 'unidade' });


// 2. Relacionamentos de SMARTLOCK
// Um armário/gavetão possui vários equipamentos vinculados como sua "base" física
SmartLock.hasMany(Equipamento, { foreignKey: 'smartlock_base_id', as: 'equipamentosBase' });
Equipamento.belongsTo(SmartLock, { foreignKey: 'smartlock_base_id', as: 'smartlockBase' });


// 3. Relacionamentos de USUÁRIO com EQUIPAMENTO (Empréstimo Atual)
// Um usuário pode estar em posse de vários equipamentos (ou nenhum)
Usuario.hasMany(Equipamento, { foreignKey: 'usuario_atual_id', as: 'equipamentosEmUso' });
Equipamento.belongsTo(Usuario, { foreignKey: 'usuario_atual_id', as: 'usuarioAtual' });


// 4. Relacionamentos de MOVIMENTAÇÃO (Trilha de Auditoria dos Equipamentos)
Equipamento.hasMany(Movimentacao, { foreignKey: 'equipamento_id', as: 'movimentacoes' });
Movimentacao.belongsTo(Equipamento, { foreignKey: 'equipamento_id', as: 'equipamento' });

Usuario.hasMany(Movimentacao, { foreignKey: 'usuario_id', as: 'movimentacoes' });
Movimentacao.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

SmartLock.hasMany(Movimentacao, { foreignKey: 'smartlock_id', as: 'movimentacoes' });
Movimentacao.belongsTo(SmartLock, { foreignKey: 'smartlock_id', as: 'smartlock' });


// 5. Relacionamentos de LOGS (Auditoria de Acessos e Hardware)
SmartLock.hasMany(LogUsuario, { foreignKey: 'smartlock_id', as: 'logsAcessoUsuarios' });
LogUsuario.belongsTo(SmartLock, { foreignKey: 'smartlock_id', as: 'smartlock' });

// O Usuário no Log pode ser nulo caso uma tag desconhecida tente abrir a porta
Usuario.hasMany(LogUsuario, { foreignKey: 'usuario_id', as: 'logsAcesso' });
LogUsuario.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

SmartLock.hasMany(LogSmartlock, { foreignKey: 'smartlock_id', as: 'logsHardware' });
LogSmartlock.belongsTo(SmartLock, { foreignKey: 'smartlock_id', as: 'smartlock' });


// ============================================================================
// EXPORTAÇÃO CENTRALIZADA
// ============================================================================
export {
  Unidade,
  Usuario,
  SmartLock,
  Equipamento,
  Movimentacao,
  LogUsuario,
  LogSmartlock
};