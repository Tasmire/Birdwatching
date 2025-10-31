export const Random = (length) => {
    let min = 0;
    let max = length - 1; //remember to take one off the array for the element
    let rand = Math.floor(Math.random() * (max - min + 1)) + min;
    return rand;
};