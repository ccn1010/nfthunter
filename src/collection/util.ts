export const isSingleFileContract = (sourceCode: string) => {
  return (
    sourceCode.indexOf('pragma') === 0 ||
    sourceCode.indexOf('//') === 0 ||
    sourceCode.indexOf('\r\n') === 0 ||
    sourceCode.indexOf('/*') === 0
  );
};

const isSymbolObject = (network: string) => {
  return network.indexOf('bsc') >= 0;
};

export const parseSourceCodeObject = (sourceCode: any, network: string) => {
  if (isSymbolObject(network)) return JSON.parse(sourceCode);
  return JSON.parse(sourceCode.substr(1, sourceCode.length - 2));
};

const getSourcesObject = (parsedSourceCode: any, network: string) => {
  if (isSymbolObject(network)) return Object.entries(parsedSourceCode);
  return Object.entries(parsedSourceCode.sources);
};

export const getContractContentList = (sourceCodes: any, network: string) => {
  const contractContent = [];
  // is array?
  for (const sourceCode of sourceCodes) {
    if (isSingleFileContract(sourceCode.SourceCode)) {
      contractContent.push({
        path: 'contract.sol',
        content: sourceCode.SourceCode,
      });
    } else {
      const parsedSourceCode = parseSourceCodeObject(
        sourceCode.SourceCode,
        network,
      );
      const sourceObjects = getSourcesObject(parsedSourceCode, network).map(
        (sourceObject: any) => {
          return {
            path: sourceObject[0],
            content: sourceObject[1].content,
          };
        },
      );
      contractContent.push(...sourceObjects);
    }
  }
  return contractContent;
};

export const isEquals = (params: any[], values) => {
  for(let i=0; i<params.length; i++) {
    const param = params[i];
    let value = values[i];
    let val = param.value;
    // TODO 测试其他类型，比如 uint
    if(param.type === 'bool'){
      value = !!value;
      val = !!val;
    }else if(param.type.startsWith('uint') || param.type.startsWith('int')){
      value = parseInt(value, 10);
      val = parseInt(val, 10);
    }

    const ret = val === value;
    if(!ret) {
      return false;
    }
  }

  return true;
}