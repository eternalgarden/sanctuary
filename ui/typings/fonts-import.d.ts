
declare module "*.otf" {
  const value: any;
  export default value;
}

// same as:
declare module '*.woff';
declare module '*.woff2';
declare module '*.ttf';

// add other font extensions if needed