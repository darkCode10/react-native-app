export function errorMessageMaker(errorMessage: string): string {
    const message =
        errorMessage.length > 100 ? errorMessage.substring(0, 100) + "..." : errorMessage;
    return message;
}


