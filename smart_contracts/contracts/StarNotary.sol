pragma solidity ^0.4.23;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";

contract StarNotary is ERC721 { 

    struct Star { 
        string name; 
        string dec;
        string mag;
        string cent;
        string story;
        bool valid; // For null check in star mappings - set true when creating
    }

    mapping(uint256 => Star) public tokenIdToStarInfo; 
    mapping(uint256 => uint256) public starsForSale;
    uint256[] existingTokenIds;

    function createStar(
        string _name,
        string _dec,
        string _mag,
        string _cent,
        string _story,
        uint256 _tokenId
    ) public { 
        require(!checkIfStarExist(_dec, _mag, _cent), "Star already exists");

        Star memory newStar = Star(_name, _dec, _mag, _cent, _story, true);

        tokenIdToStarInfo[_tokenId] = newStar;

        mint(_tokenId);
    }

    function putStarUpForSale(uint256 _tokenId, uint256 _price) public { 
        require(this.ownerOf(_tokenId) == msg.sender, "Seller must be star owner.");

        starsForSale[_tokenId] = _price;
    }

    function buyStar(uint256 _tokenId) public payable { 
        require(starsForSale[_tokenId] > 0, "Star must be for sale.");
        
        uint256 starCost = starsForSale[_tokenId];
        address starOwner = this.ownerOf(_tokenId);
        require(msg.value >= starCost, "Value must be equal or greater than star cost.");

        _removeTokenFrom(starOwner, _tokenId);
        _addTokenTo(msg.sender, _tokenId);
        
        starOwner.transfer(starCost);

        if(msg.value > starCost) { 
            msg.sender.transfer(msg.value - starCost);
        }
    }

    function checkIfStarExist(string _dec, string _mag, string _cent) public view returns (bool) {
        for (uint i = 0; i < existingTokenIds.length; i++) {
            uint256 tokenId = existingTokenIds[i];
            if (tokenIdToStarInfo[tokenId].valid) {
                Star memory star = tokenIdToStarInfo[tokenId];
                if (stringEqual(star.dec, _dec) && stringEqual(star.mag,_mag) && stringEqual(star.cent,_cent)) {
                    return true;
                }
            }
        }

        return false;
    }

    function stringEqual(string _str1, string _str2) internal pure returns (bool) {
        return keccak256(abi.encodePacked(_str1)) == keccak256(abi.encodePacked(_str2));
    }

    function mint(uint256 _tokenId) public {
        _mint(msg.sender, _tokenId);
        existingTokenIds.push(_tokenId);
    }
}