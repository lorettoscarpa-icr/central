# -*- coding: utf-8 -*-
"""Gera os ícones da marca a partir de um original quadrado.

Uso:  python gerar_icones.py [origem.png]

Sai em docs/icones/: icon-512.png, icon-192.png, icon-180.png, icon-96.png,
icon-32.png, e um arquivo com as data URIs prontas para colar no HTML.
"""
import sys, os, base64, io as _io
from PIL import Image, ImageDraw

AQUI   = os.path.dirname(os.path.abspath(__file__))
ORIGEM = sys.argv[1] if len(sys.argv) > 1 else os.path.join(AQUI, '..', '..', 'favicon.png')
TAMANHOS = [512, 192, 180, 96, 32]
RAIO_PCT = 0.18          # canto arredondado, na proporcao do icone que o Estoque ja usava
CORES    = 48            # paleta: o desenho e ouro sobre verde, nao precisa de mais          # canto arredondado, na proporção do ícone que o Estoque já usava

def cantos_arredondados(img, raio_pct=RAIO_PCT):
    """Recorta o quadrado em quadrado-arredondado, com borda suave."""
    n = img.size[0]
    ss = 4                                   # desenha 4x maior e reduz: borda sem serrilhado
    mascara = Image.new('L', (n*ss, n*ss), 0)
    ImageDraw.Draw(mascara).rounded_rectangle(
        [0, 0, n*ss-1, n*ss-1], radius=int(n*ss*raio_pct), fill=255)
    mascara = mascara.resize((n, n), Image.LANCZOS)
    fora = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    fora.paste(img.convert('RGBA'), (0, 0), mascara)
    return fora

def main():
    src = Image.open(ORIGEM).convert('RGB')
    if src.size[0] != src.size[1]:           # garante quadrado, cortando pelo centro
        lado = min(src.size)
        e = (src.size[0]-lado)//2; t = (src.size[1]-lado)//2
        src = src.crop((e, t, e+lado, t+lado))
    print('origem: %dx%d' % src.size)

    uris = []
    for n in TAMANHOS:
        img = cantos_arredondados(src.resize((n, n), Image.LANCZOS))
        # O original e um JPEG com textura no dourado, o que incha o PNG (512px dava
        # 330 KB). Sao duas cores de verdade: paleta reduzida derruba o tamanho sem
        # diferenca visivel, e FASTOCTREE preserva a transparencia dos cantos.
        img = img.quantize(colors=CORES, method=Image.FASTOCTREE)
        caminho = os.path.join(AQUI, 'icon-%d.png' % n)
        img.save(caminho, 'PNG', optimize=True)
        bruto = open(caminho, 'rb').read()
        uris.append((n, len(bruto), 'data:image/png;base64,' + base64.b64encode(bruto).decode()))
        print('  icon-%d.png  %6d bytes' % (n, len(bruto)))

    with open(os.path.join(AQUI, 'data-uris.txt'), 'w') as f:
        for n, tam, uri in uris:
            f.write('/* %dx%d — %d bytes */\n%s\n\n' % (n, n, tam, uri))
    print('data URIs em docs/icones/data-uris.txt')

if __name__ == '__main__':
    main()
