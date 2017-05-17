export interface IObject
{
    Id: string;
    Name: string;
    Icon?: number;
}

export interface IMode extends IObject
{
    Desc?: string;
}

export interface ICategory extends IObject
{
    Desc?: string;
}

export interface IBodyPart extends IObject
{
    Desc?: string;
}

export interface IScriptFile extends IObject
{
    Author: string;
    Content?: string;

    Category_Id: string;
    Mode_Id: string;
    BodyParts: Array<IBodyPart>;
};
