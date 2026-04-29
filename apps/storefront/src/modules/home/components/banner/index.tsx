import { Icon } from "@modules/common/components/my_ui"

const Banner = () => {
  return (
    <div className="flex flex-wrap justify-between bg-gray-200 px-64 py-64">
      <div className="flex flex-col items-center space-y-2">
        <Icon name="square"/>
          <h4 className="text-xl font-semibold">
            Title
          </h4>

          <p>
            Lorem ipsum dolor sit amet
          </p>
      </div>

      <div className="flex flex-col items-center space-y-2">
        <Icon name="square"/>
        <h4 className="text-xl font-semibold">
          Title
        </h4>

        <p>
          Lorem ipsum dolor sit amet
        </p>
      </div>

      <div className="flex flex-col items-center space-y-2">
        <Icon name="square"/>
        <h4 className="text-xl font-semibold">
          Title
        </h4>

        <p>
          Lorem ipsum dolor sit amet
        </p>
      </div>

    </div>
  )
}
export default Banner