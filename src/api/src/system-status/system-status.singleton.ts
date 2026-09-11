import sequelize from "../config/database";

export enum SystemStatusEnum {
  ONLINE = "online",
  OFFLINE = "offline",
  UNREACHABLE = "unreachable",
}

export type SystemStatusType = {
  worker_mqtt?: string | null;
  broker_mqtt?: string | null;
  database?: string | null;
};

class SystemStatus {
  private worker_mqtt_status: SystemStatusEnum;
  private broker_mqtt_status: SystemStatusEnum;
  private database_status: SystemStatusEnum;

  constructor() {
    this.database_status = SystemStatusEnum.OFFLINE;
    this.worker_mqtt_status = SystemStatusEnum.OFFLINE;
    this.broker_mqtt_status = SystemStatusEnum.UNREACHABLE;
  }

  public getAllStatus(): SystemStatusType {
    return {
      worker_mqtt: this.worker_mqtt_status,
      broker_mqtt: this.broker_mqtt_status,
      database: this.database_status,
    };
  }

  public getMqttStatus(): SystemStatusType {
    return {
      worker_mqtt: this.worker_mqtt_status,
      broker_mqtt: this.broker_mqtt_status,
    };
  }

  public getDatabaseStatus(): SystemStatusType {
    return { database: this.database_status };
  }

  private isStatusValido(status:string):status is SystemStatusEnum{
    return Object.values(SystemStatusEnum).includes(status as SystemStatusEnum)
  }

  public setMqttStatus(worker:string,broker:string):void{
    if(this.isStatusValido(broker)){
      this.broker_mqtt_status = broker;
    }
    if(this.isStatusValido(worker)){
      this.worker_mqtt_status = worker;
    }
  }

  public polling() {
    this.verificaConexaoDatabase()
    setTimeout(() => {
      this.verificaConexaoDatabase();
      this.polling()
    }, 15000);
  }

  private async verificaConexaoDatabase() {
    try {
      await sequelize.authenticate();
      this.database_status = SystemStatusEnum.ONLINE;
    } catch (e) {
      this.database_status = SystemStatusEnum.OFFLINE;
    }
  }
}

export default new SystemStatus();
