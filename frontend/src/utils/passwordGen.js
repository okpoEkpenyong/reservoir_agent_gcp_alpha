export const getRandomPass = (length) => {
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  return array.join("");
};
