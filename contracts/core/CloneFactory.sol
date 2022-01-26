pragma solidity ^0.8.0;
function c_0xb07c1999(bytes32 c__0xb07c1999) pure {}


// SPDX-License-Identifier: MIT

/*
The MIT License (MIT)
Copyright (c) 2018 Murray Software, LLC.
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
//solhint-disable max-line-length
//solhint-disable no-inline-assembly

contract CloneFactory {
function c_0x1db38551(bytes32 c__0x1db38551) public pure {}

    function _createClone(address target)
        internal
        returns (address payable result)
    {c_0x1db38551(0x3c1288e11dfad335e6bbd5e359a4904ea4770bdca90796b40a170d92dce8ba4c); /* function */ 

c_0x1db38551(0x5a96671c0d160ce83212b1962f35fb238010c93b5b728c598bc49b7e01c5e007); /* line */ 
        c_0x1db38551(0x7c1aa7aea969550f33dc6a906259128904ccd7c131c5fbabd13e6cf80e56ad1f); /* statement */ 
bytes20 targetBytes = bytes20(target);
c_0x1db38551(0x823b18a6fd1eb9c03fe8b7f2a87439b3b4aaa7fb91c0b0827ab629135e7c6511); /* line */ 
        assembly {
            let clone := mload(0x40)
            mstore(
                clone,
                0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000
            )
            mstore(add(clone, 0x14), targetBytes)
            mstore(
                add(clone, 0x28),
                0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000
            )
            result := create(0, clone, 0x37)
        }
    }

    function _isClone(address target, address query)
        internal
        view
        returns (bool result)
    {c_0x1db38551(0x2e136e6c1701a6ceb636ea0358a77def84b977bd11b18d33a4bf3426f1eecb5b); /* function */ 

c_0x1db38551(0xe4cce3c5024f45f765708188975d73dd25e2b9b6e3d5bf136e532018582c2566); /* line */ 
        c_0x1db38551(0x9da3a9ac8af5e9e1d2cc8ec1c344c0220401c15e0f0aae0ff74483c9170bb1b0); /* statement */ 
bytes20 targetBytes = bytes20(target);
c_0x1db38551(0x14e8b1977fa93e44f5a541143176dbe70baadc6b3565106058c44f3956190c15); /* line */ 
        assembly {
            let clone := mload(0x40)
            mstore(
                clone,
                0x363d3d373d3d3d363d7300000000000000000000000000000000000000000000
            )
            mstore(add(clone, 0xa), targetBytes)
            mstore(
                add(clone, 0x1e),
                0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000
            )

            let other := add(clone, 0x40)
            extcodecopy(query, other, 0, 0x2d)
            result := and(
                eq(mload(clone), mload(other)),
                eq(mload(add(clone, 0xd)), mload(add(other, 0xd)))
            )
        }
    }
}
