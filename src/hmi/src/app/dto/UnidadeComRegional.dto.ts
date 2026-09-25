import { IUnidade } from "../interfaces/unidade.interface";

// Possui todos os campos de IUnidade, mais o nome da regional
export interface UnidadeComRegionalDTO extends IUnidade{
    regional:string;
}