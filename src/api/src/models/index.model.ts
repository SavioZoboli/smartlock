import Unidade from './unidade.model';
import Usuario from './usuario.model';
import SmartLock from './smartlock.model';
import Equipamento from './equipamento.model';
import Movimentacao from './movimentacao.model'; // Mantendo o padrão .models enviado
import LogUsuario from './logUsuario.model';
import LogSmartlock from './logSmartlock.model';
import ItensMovimentacao from './itensMovimentacao.model';
import Reserva from './reserva.model';
import ItensReserva from './itensReserva.model';

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


Movimentacao.belongsToMany(Equipamento, {
  through: ItensMovimentacao,
  foreignKey: 'movimentacao_id',
  otherKey: 'equipamento_id',
  as: 'equipamentos',
});

Equipamento.belongsToMany(Movimentacao, {
  through: ItensMovimentacao,
  foreignKey: 'equipamento_id',
  otherKey: 'movimentacao_id',
  as: 'movimentacoes',
});

// Relacionamentos diretos com a tabela de junção (úteis para incluir dados extras da linha, ex: quantidade)
Movimentacao.hasMany(ItensMovimentacao, { foreignKey: 'movimentacao_id', as: 'itens' });
ItensMovimentacao.belongsTo(Movimentacao, { foreignKey: 'movimentacao_id', as: 'movimentacao' });

Equipamento.hasMany(ItensMovimentacao, { foreignKey: 'equipamento_id', as: 'itensMovimentacao' });
ItensMovimentacao.belongsTo(Equipamento, { foreignKey: 'equipamento_id', as: 'equipamento' });

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

// 6. Relacionamento das reservas
Reserva.belongsTo(Usuario,{foreignKey:'usuario_id',as:'usuario'})
Usuario.hasMany(Reserva,{foreignKey:'usuario_id',as:'reserva'})

Reserva.belongsTo(SmartLock,{foreignKey:'smartlock_id',as:'smartlock_origem'})
SmartLock.hasMany(Reserva,{foreignKey:'smartlock_id',as:'smartlock_reservado'})

Reserva.belongsToMany(Equipamento, {
  through: ItensReserva,
  foreignKey: 'reserva_id',
  otherKey: 'equipamento_id',
  as: 'equipamentos',
});

Equipamento.belongsToMany(Reserva, {
  through: ItensReserva,
  foreignKey: 'equipamento_id',
  otherKey: 'reserva_id',
  as: 'reservas',
});

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
  LogSmartlock,
  ItensMovimentacao,
  Reserva,
  ItensReserva
};