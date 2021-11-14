import P from "@prisma/client";

const errorRefactoring = (error) => {
  const { message, name, stack } = error;

  return {
    message,
    name,
    prismaError: true,
    stack,
  };
};

export const prismaValidator = (result) => {
  if (result === null) {
    return false;
  }

  switch (result.constructor) {
    case P.Prisma.PrismaClientInitializationError:
      return errorRefactoring(result);
    case P.Prisma.PrismaClientKnownRequestError:
      return errorRefactoring(result);
    case P.Prisma.PrismaClientRustPanicError:
      return errorRefactoring(result);
    case P.Prisma.PrismaClientUnknownRequestError:
      return errorRefactoring(result);
    case P.Prisma.PrismaClientValidationError:
      return errorRefactoring(result);
    default:
      return false;
  }
};

export default prismaValidator;
