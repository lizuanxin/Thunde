export interface IObject
{
    Id: string | null;
    Name: string | null;
    Icon?: number | null;
}

export interface IMode extends IObject
{
    Desc?: string | null;
}

export interface ICategory extends IObject
{
    Desc?: string | null;
}

export interface IBodyPart extends IObject
{
    Desc?: string | null;
}

export interface IScriptFile extends IObject
{
    Author: string | null;
    Content?: string | null;

    Category_Id: string | null;
    Mode_Id: string | null;
    BodyParts: Array<IBodyPart> | null;
};
