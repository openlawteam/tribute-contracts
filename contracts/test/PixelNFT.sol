pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
MIT License

Copyright (c) 2020 Openlaw

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

contract PixelNFT is ERC721 {
    using Counters for Counters.Counter;
    using Strings for uint32;

    Counters.Counter private _tokenIds;

    uint32 private _totalPixels;

    uint32 private _dimension;

    uint32 private constant _maxPixels = 1000 * 1000;

    mapping(uint256 => mapping(uint256 => bool)) private _pixels;

    event PixMinted(
        address owner,
        uint256 tokenId,
        string uri,
        string metadata
    );

    constructor(uint32 dimension) ERC721("Pixel Token", "PIX") {
        require(
            dimension * dimension <= _maxPixels,
            "too many pixels - max allowed: 1Mi"
        );
        _totalPixels = dimension * dimension;
        _dimension = dimension;
    }

    function mintPixel(
        address recipient,
        uint32 x,
        uint32 y
    ) external {
        require(
            x < _dimension && y < _dimension,
            "maximum amount of pixels exceeded"
        );
        require(!_pixels[x][y], "pixel already minted");

        _tokenIds.increment();

        _pixels[x][y] = true;

        uint256 newItemId = _tokenIds.current();
        bytes memory metadata = abi.encodePacked(
            "pixel: ",
            x.toString(),
            ",",
            y.toString()
        );
        _safeMint(recipient, newItemId, metadata);

        emit PixMinted(
            recipient,
            newItemId,
            tokenURI(newItemId),
            string(metadata)
        );
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return "https://www.openlaw.io/nfts/pix/";
    }
}
