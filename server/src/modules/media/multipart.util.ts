interface ParsedMultipart {
  fields: Record<string, string>;
  file: Buffer;
}

export function parseMultipartBody(body: Buffer, contentType: string | undefined): ParsedMultipart {
  const fields: Record<string, string> = {};
  let file = body;

  if (!contentType?.includes('multipart/form-data')) {
    return { fields, file };
  }

  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i);
  const boundary = boundaryMatch?.[1] ?? boundaryMatch?.[2];
  if (!boundary) {
    return { fields, file };
  }

  const parts = body
    .toString('binary')
    .split(`--${boundary}`)
    .filter((part) => part && part !== '--\r\n' && part !== '--');

  for (const part of parts) {
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) {
      continue;
    }

    const headers = part.slice(0, headerEnd);
    const content = part.slice(headerEnd + 4).replace(/\r\n$/, '');
    const nameMatch = headers.match(/name="([^"]+)"/);
    const fieldName = nameMatch?.[1];
    if (!fieldName) {
      continue;
    }

    const binaryContent = Buffer.from(content, 'binary');
    if (headers.includes('filename=')) {
      file = binaryContent;
      continue;
    }

    fields[fieldName] = binaryContent.toString('utf8');
  }

  return { fields, file };
}
